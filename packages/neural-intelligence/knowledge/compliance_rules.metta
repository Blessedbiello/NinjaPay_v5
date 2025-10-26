;; Compliance Rules Knowledge Graph for NinjaPay
;; AML/KYC/Sanctions rules using MeTTa

;; ============================================
;; AML (Anti-Money Laundering) Rules
;; ============================================

;; Transaction amount thresholds
(= (high-value-threshold) 10000.0)  ; $10,000 USD
(= (suspicious-threshold) 5000.0)   ; $5,000 USD

;; High-risk transaction patterns
(: high-risk-amount (-> Number Bool))
(= (high-risk-amount $amount)
   (> $amount (high-value-threshold)))

(: suspicious-amount (-> Number Bool))
(= (suspicious-amount $amount)
   (and (> $amount (suspicious-threshold))
        (< $amount (high-value-threshold))))

;; Structuring detection (multiple transactions below threshold)
(: structuring-pattern (-> Number Number Number Bool))
(= (structuring-pattern $tx1 $tx2 $tx3)
   (and (< $tx1 (suspicious-threshold))
        (< $tx2 (suspicious-threshold))
        (< $tx3 (suspicious-threshold))
        (> (+ (+ $tx1 $tx2) $tx3) (high-value-threshold))))

;; ============================================
;; KYC (Know Your Customer) Rules
;; ============================================

;; KYC status levels
(: kyc-status (-> String String))
(= (kyc-status "not_verified") "high_risk")
(= (kyc-status "pending") "medium_risk")
(= (kyc-status "verified") "low_risk")
(= (kyc-status "enhanced") "very_low_risk")

;; Transaction limits based on KYC level
(: transaction-limit (-> String Number))
(= (transaction-limit "not_verified") 100.0)
(= (transaction-limit "pending") 500.0)
(= (transaction-limit "verified") 10000.0)
(= (transaction-limit "enhanced") 100000.0)

;; KYC compliance check
(: kyc-compliant (-> String Number Bool))
(= (kyc-compliant $kyc_level $amount)
   (< $amount (transaction-limit $kyc_level)))

;; ============================================
;; Sanctions Screening
;; ============================================

;; High-risk countries (OFAC, UN sanctions lists)
(: high-risk-country (-> String Bool))
(= (high-risk-country "KP") True)  ; North Korea
(= (high-risk-country "IR") True)  ; Iran
(= (high-risk-country "SY") True)  ; Syria
(= (high-risk-country "CU") True)  ; Cuba
(= (high-risk-country _) False)

;; ============================================
;; Velocity Rules
;; ============================================

;; Transaction velocity checks
(: excessive-velocity (-> Number Number Bool))
(= (excessive-velocity $count $timeframe_hours)
   (> (/ $count $timeframe_hours) 10))  ; More than 10 tx/hour

;; ============================================
;; Risk Scoring
;; ============================================

;; Calculate compliance risk score (0.0 - 1.0)
(: compliance-risk-score (-> String Number Number String Number))
(= (compliance-risk-score $kyc_level $amount $tx_count $country)
   (let* (
     ($kyc_score (cond
       ((== $kyc_level "not_verified") 0.8)
       ((== $kyc_level "pending") 0.5)
       ((== $kyc_level "verified") 0.2)
       ((== $kyc_level "enhanced") 0.1)
       (True 0.9)))
     ($amount_score (cond
       ((high-risk-amount $amount) 0.9)
       ((suspicious-amount $amount) 0.6)
       (True 0.2)))
     ($velocity_score (cond
       ((> $tx_count 50) 0.8)
       ((> $tx_count 20) 0.5)
       (True 0.1)))
     ($country_score (if (high-risk-country $country) 1.0 0.0))
   )
   (/ (+ (+ (+ $kyc_score $amount_score) $velocity_score) $country_score) 4.0)))

;; ============================================
;; Compliance Actions
;; ============================================

;; Determine required action based on risk score
(: required-action (-> Number String))
(= (required-action $risk_score)
   (cond
     ((> $risk_score 0.8) "block")
     ((> $risk_score 0.6) "manual_review")
     ((> $risk_score 0.4) "enhanced_monitoring")
     (True "approve")))

;; ============================================
;; Reporting Requirements
;; ============================================

;; CTR (Currency Transaction Report) threshold
(: requires-ctr (-> Number Bool))
(= (requires-ctr $amount)
   (> $amount 10000.0))

;; SAR (Suspicious Activity Report) indicators
(: requires-sar (-> Number Number Number String Bool))
(= (requires-sar $amount $tx_count $time_hours $pattern)
   (or (and (suspicious-amount $amount)
            (> $tx_count 5)
            (< $time_hours 24))
       (and (== $pattern "structuring") True)
       (and (high-risk-amount $amount)
            (> $tx_count 3)
            (< $time_hours 24))))

;; ============================================
;; Enhanced Due Diligence (EDD)
;; ============================================

;; Criteria for EDD
(: requires-edd (-> String Number Number Bool))
(= (requires-edd $country $amount $monthly_volume)
   (or (high-risk-country $country)
       (> $amount 50000.0)
       (> $monthly_volume 500000.0)))
