use redis::{aio::Connection, AsyncCommands, Client};
use std::error::Error;
use crate::mpc::types::{ComputationMetadata, ComputationStatus};

/// Redis client for caching computation metadata and results
pub struct RedisClient {
    client: Client,
}

impl RedisClient {
    pub fn new(redis_url: &str) -> Result<Self, Box<dyn Error>> {
        let client = Client::open(redis_url)?;
        Ok(Self { client })
    }

    pub async fn get_connection(&self) -> Result<Connection, Box<dyn Error>> {
        let conn = self.client.get_async_connection().await?;
        Ok(conn)
    }

    /// Health check - PING command
    pub async fn ping(&self) -> Result<(), Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let pong: String = redis::cmd("PING").query_async(&mut conn).await?;
        if pong == "PONG" {
            Ok(())
        } else {
            Err(format!("Unexpected PING response: {}", pong).into())
        }
    }

    /// Store computation metadata
    pub async fn store_computation_metadata(
        &self,
        metadata: &ComputationMetadata,
    ) -> Result<(), Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let key = format!("comp:{}", metadata.computation_id);

        // Serialize metadata to JSON
        let json = serde_json::to_string(metadata)?;
        conn.set_ex(&key, json, 3600).await?; // 1 hour TTL

        // Add to user's computation set
        let user_key = format!("user:{}:computations", metadata.user_pubkey);
        conn.sadd(&user_key, &metadata.computation_id).await?;
        conn.expire(&user_key, 86400).await?; // 24 hour TTL

        log::debug!("Stored computation {} in Redis", metadata.computation_id);
        Ok(())
    }

    /// Retrieve computation metadata
    pub async fn get_computation_metadata(
        &self,
        computation_id: &str,
    ) -> Result<Option<ComputationMetadata>, Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let key = format!("comp:{}", computation_id);

        let json: Option<String> = conn.get(&key).await?;
        match json {
            Some(data) => {
                let metadata: ComputationMetadata = serde_json::from_str(&data)?;
                Ok(Some(metadata))
            }
            None => Ok(None),
        }
    }

    /// Store computation result
    pub async fn store_result(
        &self,
        computation_id: &str,
        result: &[u8],
        ttl_seconds: usize,
    ) -> Result<(), Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let key = format!("result:{}", computation_id);

        conn.set_ex(&key, result, ttl_seconds as u64).await?;

        log::debug!("Stored result for computation {} in Redis", computation_id);
        Ok(())
    }

    /// Retrieve computation result
    pub async fn get_result(
        &self,
        computation_id: &str,
    ) -> Result<Option<Vec<u8>>, Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let key = format!("result:{}", computation_id);

        let result: Option<Vec<u8>> = conn.get(&key).await?;
        Ok(result)
    }

    /// List computations for a user
    pub async fn list_user_computations(
        &self,
        user_pubkey: &str,
        limit: usize,
    ) -> Result<Vec<ComputationMetadata>, Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let user_key = format!("user:{}:computations", user_pubkey);

        // Get computation IDs from set
        let computation_ids: Vec<String> = conn.smembers(&user_key).await?;

        // Fetch metadata for each computation
        let mut computations = Vec::new();
        for id in computation_ids.iter().take(limit) {
            if let Some(metadata) = self.get_computation_metadata(id).await? {
                computations.push(metadata);
            }
        }

        // Sort by created_at (newest first)
        computations.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(computations)
    }

    /// Update computation status
    pub async fn update_computation_status(
        &self,
        computation_id: &str,
        status: ComputationStatus,
    ) -> Result<(), Box<dyn Error>> {
        // Get existing metadata
        let mut metadata = self.get_computation_metadata(computation_id).await?
            .ok_or("Computation not found")?;

        // Update status
        metadata.status = status.clone();

        // Set completed_at if finished
        if matches!(status, ComputationStatus::Completed) {
            metadata.completed_at = Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
            );
        }

        // Store updated metadata
        self.store_computation_metadata(&metadata).await?;

        log::info!("Updated computation {} status to: {:?}", computation_id, status);
        Ok(())
    }

    /// Health check
    pub async fn health_check(&self) -> Result<bool, Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let pong: String = redis::cmd("PING").query_async(&mut conn).await?;
        Ok(pong == "PONG")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires Redis instance
    async fn test_redis_connection() {
        let client = RedisClient::new("redis://127.0.0.1:6379").unwrap();
        assert!(client.health_check().await.is_ok());
    }
}
