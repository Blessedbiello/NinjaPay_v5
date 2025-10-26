;; Fraud Detection Patterns Knowledge Graph
;; Semantic reasoning for fraud detection in encrypted transactions

;; ============================================
;; Transaction Fraud Patterns
;; ============================================

;; Round number fraud (fraudsters often use round numbers)
(: round-number-pattern (-> Number Bool))
(= (round-number-pattern $amount)
   (and (> $amount 100.0)
        (== (mod $amount 100.0) 0.0)))

;; Rapid succession pattern
(: rapid-succession (-> Number Number Bool))
(= (rapid-succession $time_diff_seconds $count)
   (and (< $time_diff_seconds 60)  ; Within 1 minute
        (> $count 3)))  ; More than 3 transactions

;; Time-of-day anomaly (unusual transaction times)
(: unusual-time (-> Number Bool))
(= (unusual-time $hour)
   (or (< $hour 4)   ; 12am - 4am
       (> $hour 23))) ; 11pm - 12am

;; Geographic velocity impossible (transactions from different locations too quickly)
(: impossible-velocity (-> Number Number Number Bool))
(= (impossible-velocity $distance_km $time_minutes $max_speed_kmh)
   (> (/ $distance_km (/ $time_minutes 60.0)) $max_speed_kmh))

;; ============================================
;; Account Takeover Indicators
;; ============================================

;; Sudden behavior change
(: behavior-change (-> Number Number Number Bool))
(= (behavior-change $avg_tx_amount $current_amount $deviation_factor)
   (> (abs (- $current_amount $avg_tx_amount))
      (* $avg_tx_amount $deviation_factor)))

;; New device/location
(: new-device-high-value (-> Bool Number Bool))
(= (new-device-high-value $is_new_device $amount)
   (and $is_new_device
        (> $amount 1000.0)))

;; ============================================
;; Merchant Fraud Patterns
;; ============================================

;; Test card pattern (multiple small transactions)
(: test-card-pattern (-> Number Number Bool))
(= (test-card-pattern $count $total_amount)
   (and (> $count 5)
        (< (/ $total_amount $count) 10.0)))  ; Average < $10

;; Refund abuse pattern
(: refund-abuse (-> Number Number Number Bool))
(= (refund-abuse $purchase_count $refund_count $refund_rate)
   (and (> $refund_count 3)
        (> (/ $refund_count $purchase_count) $refund_rate)))

;; ============================================
;; P2P Fraud Patterns
;; ============================================

;; Mule account indicator
(: mule-account-pattern (-> Number Number Number Bool))
(= (mule-account-pattern $inflow $outflow $timeframe_hours)
   (and (> $inflow 5000.0)
        (> $outflow (* $inflow 0.9))  ; Outflow is 90%+ of inflow
        (< $timeframe_hours 48)))  ; Within 48 hours

;; Chain transaction pattern (A→B→C→A circular)
(: circular-transaction (-> String String String Bool))
(= (circular-transaction $addr1 $addr2 $addr3)
   (and (== $addr1 $addr3)
        (!= $addr1 $addr2)))

;; ============================================
;; Fraud Risk Scoring
;; ============================================

;; Calculate fraud probability
(: fraud-probability (->
     Number   ; amount
     Number   ; tx_count_24h
     Number   ; time_hour
     Bool     ; new_device
     Number   ; avg_tx_amount
     Number)) ; returns probability 0.0-1.0
(= (fraud-probability $amount $tx_count $hour $new_device $avg_amount)
   (let* (
     ;; Amount anomaly score
     ($amount_score (cond
       ((round-number-pattern $amount) 0.3)
       ((behavior-change $avg_amount $amount 3.0) 0.5)
       (True 0.1)))

     ;; Velocity score
     ($velocity_score (cond
       ((> $tx_count 20) 0.7)
       ((> $tx_count 10) 0.4)
       (True 0.1)))

     ;; Time anomaly score
     ($time_score (if (unusual-time $hour) 0.4 0.0))

     ;; Device score
     ($device_score (if (new-device-high-value $new_device $amount) 0.5 0.0))
   )
   ;; Weighted average
   (/ (+ (+ (+ (* $amount_score 0.3)
               (* $velocity_score 0.3))
            (* $time_score 0.2))
         (* $device_score 0.2))
      1.0)))

;; ============================================
;; Fraud Type Classification
;; ============================================

;; Determine fraud type based on indicators
(: classify-fraud-type (-> Number Number Bool Number String))
(= (classify-fraud-type $tx_count $time_diff $new_device $amount)
   (cond
     ((test-card-pattern $tx_count $amount) "card_testing")
     ((and $new_device (behavior-change 500.0 $amount 4.0)) "account_takeover")
     ((rapid-succession $time_diff $tx_count) "automated_fraud")
     ((round-number-pattern $amount) "manual_fraud")
     (True "unknown")))

;; ============================================
;; Action Recommendations
;; ============================================

;; Determine action based on fraud probability
(: fraud-action (-> Number String))
(= (fraud-action $probability)
   (cond
     ((> $probability 0.85) "block")
     ((> $probability 0.65) "challenge")  ; Require MFA
     ((> $probability 0.45) "monitor")
     (True "approve")))

;; Additional verification required
(: requires-verification (-> Number Number Bool Bool))
(= (requires-verification $probability $amount $new_device)
   (or (> $probability 0.5)
       (and $new_device (> $amount 5000.0))))

;; ============================================
;; Pattern Matching Rules
;; ============================================

;; Combine multiple weak signals
(: weak-signals-threshold (-> Number Number Number Number Bool))
(= (weak-signals-threshold $signal1 $signal2 $signal3 $signal4)
   (> (+ (+ (+ $signal1 $signal2) $signal3) $signal4) 1.5))

;; Strong signal (immediate flag)
(: strong-fraud-signal (-> Number Bool))
(= (strong-fraud-signal $probability)
   (> $probability 0.9))
