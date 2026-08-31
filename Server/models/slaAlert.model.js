import mongoose from "mongoose";

const slaAlertSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },

        type: {
            type: String,
            enum: ["at_risk", "breached"],
            required: true,
        },

        acknowledged: {
            type: Boolean,
            default: false,
        },

        acknowledgedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        acknowledgedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const SLAAlert = mongoose.model(
    "SLAAlert",
    slaAlertSchema
);

export default SLAAlert;