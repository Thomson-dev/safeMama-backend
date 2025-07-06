import mongoose from 'mongoose';

const PaymentStatusSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  reason: { 
    type: String, 
    enum: ["ANC4", "DELIVERY"], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "processing", "paid", "failed", "cancelled"], 
    default: "pending" 
  },
  eligibilityDate: { 
    type: Date, 
    required: true 
  },
  paidAt: { 
    type: Date 
  },
  transactionReference: { 
    type: String 
  },
  paymentMethod: { 
    type: String, 
    enum: ["mobile_money", "bank_transfer", "cash"], 
    default: "mobile_money" 
  },

accountInfo: {
    bank: String,
    accountNumber: String,
  },
  notes: { 
    type: String 
  },
  processedBy: { 
    type: String // Admin user who processed the payment
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
PaymentStatusSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('PaymentStatus', PaymentStatusSchema);
