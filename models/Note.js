import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pdf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PDF',
      required: true,
    },
    title: {
      type: String,
      default: '', // optional
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

export default mongoose.model('Note', noteSchema);
