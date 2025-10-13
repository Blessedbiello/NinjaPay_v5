use redis::{aio::Connection, AsyncCommands, Client};
use std::error::Error;

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

    /// Store computation metadata
    pub async fn store_computation(
        &self,
        computation_id: &str,
        metadata: &str,
        ttl_seconds: usize,
    ) -> Result<(), Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let key = format!("computation:{}", computation_id);

        conn.set_ex(&key, metadata, ttl_seconds as u64).await?;

        log::debug!("Stored computation {} in Redis", computation_id);
        Ok(())
    }

    /// Retrieve computation metadata
    pub async fn get_computation(
        &self,
        computation_id: &str,
    ) -> Result<Option<String>, Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let key = format!("computation:{}", computation_id);

        let result: Option<String> = conn.get(&key).await?;
        Ok(result)
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
    ) -> Result<Vec<String>, Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let pattern = format!("user:{}:comp:*", user_pubkey);

        let keys: Vec<String> = conn.keys(&pattern).await?;
        Ok(keys)
    }

    /// Update computation status
    pub async fn update_status(
        &self,
        computation_id: &str,
        status: &str,
    ) -> Result<(), Box<dyn Error>> {
        let mut conn = self.get_connection().await?;
        let key = format!("status:{}", computation_id);

        conn.set_ex(&key, status, 86400).await?; // 24 hour TTL

        log::debug!("Updated status for computation {} to {}", computation_id, status);
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
