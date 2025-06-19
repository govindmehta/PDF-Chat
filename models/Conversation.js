import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
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
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt fields automatically
);

export default mongoose.model('Conversation', conversationSchema);
