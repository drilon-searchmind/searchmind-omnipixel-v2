import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomerTrackingScanScores from '@/models/CustomerTrackingScanScores';
import mongoose from 'mongoose';

export async function POST(request) {
    try {
        const body = await request.json();
        const { customerId, referrer, scores } = body;

        // Only save if referrer matches
        if (referrer !== 'searcmind-apex-tracking-score') {
            return NextResponse.json(
                { success: false, message: 'Referrer does not match required value' },
                { status: 403 }
            );
        }

        // Validate customerId
        if (!customerId) {
            return NextResponse.json(
                { success: false, message: 'customerId is required' },
                { status: 400 }
            );
        }

        // Validate scores
        if (!scores || typeof scores !== 'object') {
            return NextResponse.json(
                { success: false, message: 'Scores object is required' },
                { status: 400 }
            );
        }

        // Validate customerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid customerId format' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Create new score record
        const scoreRecord = new CustomerTrackingScanScores({
            customer: new mongoose.Types.ObjectId(customerId),
            totalScore: scores.overall || 0,
            performanceScore: scores.performance || 0,
            trackingScore: scores.tracking || 0,
            complianceScore: scores.compliance || 0,
        });

        await scoreRecord.save();

        return NextResponse.json({
            success: true,
            message: 'Scores saved successfully',
            data: {
                id: scoreRecord._id,
                customer: scoreRecord.customer,
                totalScore: scoreRecord.totalScore,
                performanceScore: scoreRecord.performanceScore,
                trackingScore: scoreRecord.trackingScore,
                complianceScore: scoreRecord.complianceScore,
                createdAt: scoreRecord.createdAt,
            },
        });

    } catch (error) {
        console.error('Error saving scores:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to save scores' },
            { status: 500 }
        );
    }
}
