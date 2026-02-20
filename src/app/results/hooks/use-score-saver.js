"use client";

import { useEffect, useRef } from "react";
import { calculateScores } from "../utils/score-calculator";

/**
 * Hook to save scores to MongoDB when referrer matches
 */
export function useScoreSaver(results, referrer, customerId) {
    const hasSaved = useRef(false);

    useEffect(() => {
        // Only proceed if we have results
        if (!results || hasSaved.current) {
            return;
        }

        // Only save if referrer matches
        if (referrer !== 'searcmind-apex-tracking-score' || !customerId) {
            return;
        }

        // Calculate scores
        const scores = calculateScores(results);
        if (!scores) {
            return;
        }

        const saveScores = async () => {
            try {
                const response = await fetch('/api/save-scores', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerId,
                        referrer,
                        scores: {
                            overall: scores.overall,
                            performance: scores.performance,
                            tracking: scores.tracking,
                            compliance: scores.compliance,
                        },
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Scores saved successfully:', data);
                    hasSaved.current = true;
                } else {
                    const errorData = await response.json();
                    console.error('Failed to save scores:', errorData);
                }
            } catch (error) {
                console.error('Error saving scores:', error);
            }
        };

        saveScores();
    }, [results, referrer, customerId]);
}
