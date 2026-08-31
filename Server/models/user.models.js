import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    hashpassword: {
      type: String,
      required: true,
    },
    
    role: {
      type: String,
      enum: ["agent", "supervisor"],
      required: true,
      default: "agent",
    },
  },
  { timestamps: true },
);

 const User = mongoose.model("User", userSchema);
 export default User ; 
