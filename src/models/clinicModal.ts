import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  lga: { type: String, required: true },
  state: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  contactPerson: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Clinic", clinicSchema);