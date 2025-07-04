const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },

  dob: { type: Date, required: true },
  edd: { type: Date, required: true },
  lmp: { type: Date },
  address: { type: String },
  language: { type: String, default: "English" },

  clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },

  reminders: {
    ancVisits: { type: Number, default: 0 },
    lastReminderSent: { type: Date },
    nextAppointment: { type: Date },
    deliveryReminderSent: { type: Boolean, default: false },
    postnatalReminderSent: { type: Boolean, default: false },
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "eligible", "paid", "ineligible"],
    default: "pending"
  },
  eligibilityReason: {
    type: String,
    enum: ["ANC4", "DELIVERY", null],
    default: null
  },
  cashIncentiveAmount: { type: Number, default: 0 },

  notificationPreferences: {
    tips: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true }
  },

  isBeneficiary: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
