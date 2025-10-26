;; Financial Domain Ontology for NinjaPay
;; Defines concepts, relationships, and rules for financial transactions

;; ============================================
;; Entity Types
;; ============================================

(: entity-type (-> String String))
(= (entity-type "user") "individual")
(= (entity-type "merchant") "business")
(= (entity-type "company") "corporation")

;; ============================================
;; Transaction Types
;; ============================================

(: transaction-category (-> String String))
(= (transaction-category "p2p") "peer_to_peer")
(= (transaction-category "merchant_payment") "commercial")
(= (transaction-category "payroll") "employment")
(= (transaction-category "refund") "reversal")
(= (transaction-category "withdrawal") "cash_out")
(= (transaction-category "deposit") "cash_in")

;; Risk level by transaction type
(: tx-type-risk (-> String String))
(= (tx-type-risk "p2p") "medium")
(= (tx-type-risk "merchant_payment") "low")
(= (tx-type-risk "payroll") "very_low")
(= (tx-type-risk "withdrawal") "medium")
(= (tx-type-risk "refund") "low")

;; ============================================
;; Merchant Categories
;; ============================================

;; High-risk merchant categories (MCC codes)
(: high-risk-mcc (-> Number Bool))
(= (high-risk-mcc 7995) True)  ; Gambling
(= (high-risk-mcc 5967) True)  ; Direct marketing
(= (high-risk-mcc 5122) True)  ; Drugs/pharma
(= (high-risk-mcc 7273) True)  ; Dating services
(= (high-risk-mcc _) False)

;; ============================================
;; Payment Methods
;; ============================================

(: payment-method-risk (-> String Number))
(= (payment-method-risk "crypto") 0.6)
(= (payment-method-risk "bank_transfer") 0.2)
(= (payment-method-risk "card") 0.4)
(= (payment-method-risk "wallet") 0.3)

;; ============================================
;; Relationships
;; ============================================

;; Trusted relationship (reduces risk)
(: trusted-counterparty (-> String String Bool Bool))
(= (trusted-counterparty $user1 $user2 $has_history)
   $has_history)

;; First-time transaction (increases risk)
(: first-time-tx (-> String String Number Bool))
(= (first-time-tx $sender $recipient $tx_history_count)
   (== $tx_history_count 0))

;; ============================================
;; User Reputation
;; ============================================

;; Reputation score calculation
(: reputation-score (-> Number Number Number Number))
(= (reputation-score $successful_tx $failed_tx $disputed_tx)
   (let* (
     ($total (+ (+ $successful_tx $failed_tx) $disputed_tx))
     ($success_rate (if (> $total 0)
                        (/ $successful_tx $total)
                        0.5))
     ($dispute_penalty (* $disputed_tx 0.1))
   )
   (- $success_rate $dispute_penalty)))

;; Trust level based on reputation
(: trust-level (-> Number String))
(= (trust-level $reputation)
   (cond
     ((> $reputation 0.95) "excellent")
     ((> $reputation 0.85) "good")
     ((> $reputation 0.70) "fair")
     ((> $reputation 0.50) "poor")
     (True "very_poor")))

;; ============================================
;; Liquidity Management
;; ============================================

;; Optimal liquidity ratio
(: optimal-liquidity (-> String Number))
(= (optimal-liquidity "merchant") 0.15)  ; 15% liquid
(= (optimal-liquidity "user") 0.50)      ; 50% liquid
(= (optimal-liquidity "company") 0.10)   ; 10% liquid

;; Liquidity health check
(: liquidity-healthy (-> String Number Number Bool))
(= (liquidity-healthy $entity_type $liquid $total)
   (let (
     ($ratio (/ $liquid $total))
     ($target (optimal-liquidity $entity_type))
   )
   (and (> $ratio (* $target 0.8))
        (< $ratio (* $target 1.5)))))

;; ============================================
;; Cost Optimization
;; ============================================

;; Transaction routing recommendation
(: recommend-routing (-> Number Number String))
(= (recommend-routing $amount $urgency)
   (cond
     ((and (< $amount 100.0) (< $urgency 5)) "L2")  ; MagicBlock
     ((and (> $amount 10000.0) (> $urgency 8)) "L1")  ; Solana direct
     ((> $urgency 7) "L2")  ; Speed priority
     (True "L1")))  ; Cost priority

;; Expected cost calculation
(: expected-cost (-> String Number Number))
(= (expected-cost "L1" $amount) (* $amount 0.0001))  ; 0.01%
(= (expected-cost "L2" $amount) 0.02)  ; Flat $0.02

;; ============================================
;; Time-based Rules
;; ============================================

;; Business hours
(: business-hours (-> Number Bool))
(= (business-hours $hour)
   (and (>= $hour 9) (<= $hour 17)))

;; Weekend
(: is-weekend (-> Number Bool))
(= (is-weekend $day_of_week)
   (or (== $day_of_week 6) (== $day_of_week 7)))

;; ============================================
;; Growth Metrics
;; ============================================

;; Healthy growth rate
(: healthy-growth (-> Number Number Bool))
(= (healthy-growth $current_month $previous_month)
   (let (
     ($growth_rate (/ (- $current_month $previous_month) $previous_month))
   )
   (and (> $growth_rate 0.05)  ; At least 5% growth
        (< $growth_rate 0.50))))  ; But not > 50% (suspicious)

;; Churn risk
(: churn-risk (-> Number Number Number))
(= (churn-risk $days_since_last_tx $avg_tx_frequency)
   (if (> $days_since_last_tx (* $avg_tx_frequency 3))
       0.8  ; High churn risk
       0.2))  ; Low churn risk

;; ============================================
;; Privacy Considerations
;; ============================================

;; Can analyze without decryption
(: privacy-safe-analysis (-> String Bool))
(= (privacy-safe-analysis "amount_commitment") True)  ; Pedersen commitment
(= (privacy-safe-analysis "transaction_count") True)
(= (privacy-safe-analysis "timing_pattern") True)
(= (privacy-safe-analysis "network_graph") True)
(= (privacy-safe-analysis "exact_amount") False)  ; Requires decryption
