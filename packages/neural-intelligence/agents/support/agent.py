"""
SupportAgent - ASI:One Chat-Enabled Customer Support
Handles customer queries using Chat Protocol and MeTTa knowledge base
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from uagents import Context, Model
from agents.base import NeuralAgent, AgentResponse
from agents.protocols import SupportQueryRequest, SupportQueryResponse
from knowledge import get_knowledge_base


# ASI:One Chat Protocol Models
class ChatMessage(Model):
    """Chat message from user (ASI:One compatible)"""
    message: str
    user_id: str
    context: Dict[str, Any] = {}


class ChatAcknowledgement(Model):
    """Chat response to user (ASI:One compatible)"""
    message: str
    confidence: float
    sources: List[str] = []


class SupportAgent(NeuralAgent):
    """
    Customer support agent with ASI:One Chat Protocol

    Capabilities:
    - Natural language query handling
    - Transaction status lookups
    - FAQ responses using MeTTa knowledge base
    - Escalation to human support when needed
    """

    def __init__(self):
        super().__init__(
            name="SupportAgent",
            seed=os.getenv(
                "SUPPORT_AGENT_SEED",
                os.getenv("AGENT_SEED", "support_agent_seed_phrase")
            ),
            port=int(os.getenv("SUPPORT_AGENT_PORT", 8104)),
            endpoint=[f"http://localhost:{os.getenv('SUPPORT_AGENT_PORT', 8104)}/submit"],
            mailbox=os.getenv("AGENT_MAILBOX_KEY"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

        self.knowledge_base = None
        self.register_message_handler("support_query", self.handle_support_query)
        self.queries_handled = 0
        self.escalations = 0

        # Register ASI:One Chat Protocol handler
        self._register_chat_protocol()

    def _register_chat_protocol(self):
        """Register ASI:One Chat Protocol handlers"""

        @self.agent.on_message(model=ChatMessage)
        async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
            """Handle incoming chat message from ASI:One"""
            self.logger.info(f"Chat message from {sender}: {msg.message}")

            try:
                # Process the query
                answer, confidence, sources = await self.process_chat_query(
                    msg.message,
                    msg.user_id,
                    msg.context
                )

                # Send chat acknowledgement
                response = ChatAcknowledgement(
                    message=answer,
                    confidence=confidence,
                    sources=sources
                )

                await ctx.send(sender, response)
                self.queries_handled += 1

            except Exception as e:
                self.logger.error(f"Error handling chat: {e}", exc_info=True)
                # Send error response
                await ctx.send(sender, ChatAcknowledgement(
                    message="I apologize, but I encountered an error processing your request. Please try again or contact human support.",
                    confidence=0.0,
                    sources=[]
                ))

    async def _on_startup(self, ctx: Context):
        """Initialize agent"""
        await super()._on_startup(ctx)

        try:
            self.knowledge_base = get_knowledge_base()
            self.logger.info("MeTTa knowledge base loaded")
        except Exception as e:
            self.logger.error(f"Failed to load MeTTa: {e}")

        self.logger.info("SupportAgent ready for chat on ASI:One")
        self.logger.info(f"Agent address: {self.agent.address}")

    async def handle_support_query(self, ctx: Context, msg) -> AgentResponse:
        """Handle support query via API"""
        try:
            request = SupportQueryRequest(**msg.payload)

            answer, confidence, sources = await self.process_chat_query(
                request.query_text,
                request.user_id,
                request.context
            )

            # Determine if escalation needed
            escalate = confidence < 0.5 or request.urgency == "critical"

            if escalate:
                self.escalations += 1

            result = {
                "query_id": request.query_id,
                "answer": answer,
                "confidence": confidence,
                "sources": sources,
                "escalate": escalate,
                "suggested_actions": await self.suggest_actions(request.query_text),
                "timestamp": datetime.utcnow().isoformat()
            }

            self.queries_handled += 1

            return AgentResponse(
                request_id=msg.message_id,
                success=True,
                data=result,
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

        except Exception as e:
            self.logger.error(f"Error handling query: {e}", exc_info=True)
            return AgentResponse(
                request_id=msg.message_id,
                success=False,
                error=str(e),
                agent_id=self.name,
                timestamp=datetime.utcnow()
            )

    async def process_chat_query(
        self,
        query_text: str,
        user_id: str,
        context: Dict[str, Any]
    ) -> tuple[str, float, List[str]]:
        """
        Process a chat query and generate response

        Returns:
            (answer, confidence, sources)
        """
        self.logger.info(f"Processing query: {query_text[:50]}...")

        # Classify query type
        query_type = self.classify_query(query_text)

        # Route to appropriate handler
        if query_type == "transaction_status":
            answer, confidence, sources = await self.handle_transaction_query(
                query_text, user_id, context
            )
        elif query_type == "account":
            answer, confidence, sources = await self.handle_account_query(
                query_text, user_id
            )
        elif query_type == "general":
            answer, confidence, sources = await self.handle_general_query(
                query_text
            )
        else:
            answer, confidence, sources = await self.handle_faq_query(query_text)

        return answer, confidence, sources

    def classify_query(self, query_text: str) -> str:
        """Classify query type"""
        query_lower = query_text.lower()

        if any(word in query_lower for word in ["transaction", "payment", "transfer", "status"]):
            return "transaction_status"
        elif any(word in query_lower for word in ["account", "balance", "wallet", "kyc"]):
            return "account"
        elif any(word in query_lower for word in ["how", "what", "why", "when", "where"]):
            return "faq"
        else:
            return "general"

    async def handle_transaction_query(
        self,
        query: str,
        user_id: str,
        context: Dict[str, Any]
    ) -> tuple[str, float, List[str]]:
        """Handle transaction-related queries"""
        # Extract transaction ID if mentioned
        tx_id = context.get("transaction_id")

        if tx_id:
            # Look up transaction
            tx = await self.get_transaction_details(tx_id)

            if tx:
                status = tx.get("status", "unknown")
                answer = f"Your transaction (ID: {tx_id}) is currently {status}. "

                if status == "PENDING":
                    answer += "It should be confirmed within a few minutes."
                elif status == "COMPLETED":
                    answer += "The transaction has been successfully completed."
                elif status == "FAILED":
                    answer += "Unfortunately, the transaction failed. Please contact support for more details."

                return answer, 0.9, [f"transaction:{tx_id}"]
            else:
                return (
                    f"I couldn't find transaction {tx_id}. Please verify the transaction ID.",
                    0.7,
                    []
                )
        else:
            # General transaction help
            return (
                "I can help you track your transaction status. Please provide your transaction ID, and I'll look it up for you.",
                0.8,
                ["transaction_help"]
            )

    async def handle_account_query(
        self,
        query: str,
        user_id: str
    ) -> tuple[str, float, List[str]]:
        """Handle account-related queries"""
        # Get user account info
        user = await self.get_user_info(user_id)

        if user:
            kyc_status = user.get("kyc_status", "not_verified")

            if "kyc" in query.lower() or "verify" in query.lower():
                if kyc_status == "verified":
                    answer = "Your account is fully verified. You have access to all features."
                elif kyc_status == "pending":
                    answer = "Your KYC verification is pending review. This typically takes 1-2 business days."
                else:
                    answer = "Your account is not yet verified. Please complete KYC verification to access all features."

                return answer, 0.85, [f"user:{user_id}", "kyc_info"]
            else:
                return (
                    "How can I help you with your account? You can ask about your balance, KYC status, or account settings.",
                    0.75,
                    ["account_help"]
                )
        else:
            return (
                "I couldn't find your account information. Please ensure you're logged in.",
                0.6,
                []
            )

    async def handle_faq_query(self, query: str) -> tuple[str, float, List[str]]:
        """Handle FAQ queries using knowledge base"""
        # Common FAQs
        faqs = {
            "how does payment work": (
                "NinjaPay uses confidential payments powered by Arcium MPC and Solana. Your transaction amounts are encrypted, ensuring privacy while maintaining transparency through zero-knowledge proofs.",
                0.9,
                ["payment_how_it_works"]
            ),
            "what are fees": (
                "Transaction fees are approximately $0.00025 on Solana L1, or ~$0.02 flat on MagicBlock L2 for faster transactions.",
                0.95,
                ["fee_structure"]
            ),
            "how long confirmation": (
                "Transactions on Solana L1 typically confirm in 400-500ms. MagicBlock L2 transactions are even faster at 10-50ms.",
                0.9,
                ["confirmation_time"]
            ),
            "is it safe": (
                "Yes, NinjaPay uses military-grade encryption through Arcium MPC, which distributes private keys across multiple nodes. Your funds are secure, and amounts are confidential.",
                0.95,
                ["security"]
            )
        }

        # Find matching FAQ
        query_lower = query.lower()
        for faq_key, (answer, confidence, sources) in faqs.items():
            if any(word in query_lower for word in faq_key.split()):
                return answer, confidence, sources

        # No match found
        return (
            "I don't have specific information about that. Please rephrase your question or contact our support team for assistance.",
            0.4,
            []
        )

    async def handle_general_query(self, query: str) -> tuple[str, float, List[str]]:
        """Handle general queries"""
        return (
            "I'm here to help with your NinjaPay account and transactions. You can ask me about:\n\n" +
            "• Transaction status and history\n" +
            "• Account verification (KYC)\n" +
            "• Payment fees and confirmation times\n" +
            "• Security and privacy features\n\n" +
            "What would you like to know?",
            0.8,
            ["general_help"]
        )

    async def suggest_actions(self, query_text: str) -> List[str]:
        """Suggest actions based on query"""
        actions = []

        if "transaction" in query_text.lower():
            actions.append("view_transaction_history")

        if "kyc" in query_text.lower() or "verify" in query_text.lower():
            actions.append("complete_kyc_verification")

        if "fail" in query_text.lower() or "error" in query_text.lower():
            actions.append("contact_support")

        return actions

    # Database helpers

    async def get_transaction_details(self, tx_id: str) -> Optional[Dict]:
        """Get transaction details from database"""
        try:
            query = "SELECT id, status, created_at FROM transactions WHERE id = $1"
            results = await self.query_database(query, tx_id)
            return results[0] if results else None
        except Exception as e:
            self.logger.error(f"Error fetching transaction: {e}")
            return None

    async def get_user_info(self, user_id: str) -> Optional[Dict]:
        """Get user information"""
        try:
            query = "SELECT id, wallet_address FROM users WHERE id = $1"
            results = await self.query_database(query, user_id)
            return results[0] if results else None
        except Exception as e:
            self.logger.error(f"Error fetching user: {e}")
            return None

    async def handle_api_request(self, message_type: str, data: Dict) -> Dict:
        """Handle API request"""
        if message_type == "support_query":
            request = SupportQueryRequest(**data)
            answer, confidence, sources = await self.process_chat_query(
                request.query_text,
                request.user_id,
                request.context
            )

            return {
                "query_id": request.query_id,
                "answer": answer,
                "confidence": confidence,
                "sources": sources,
                "escalate": confidence < 0.5 or request.urgency == "critical",
                "suggested_actions": await self.suggest_actions(request.query_text),
                "timestamp": datetime.utcnow().isoformat()
            }

        return {"error": "Unknown message type"}

    async def get_metrics(self) -> Dict[str, Any]:
        """Get agent metrics"""
        return {
            "queries_handled": self.queries_handled,
            "escalations": self.escalations,
            "escalation_rate": round(self.escalations / max(self.queries_handled, 1), 3)
        }


if __name__ == "__main__":
    agent = SupportAgent()
    agent.run()
