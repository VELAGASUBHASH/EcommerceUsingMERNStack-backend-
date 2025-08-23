import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const AuthSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Name is Required"]
    },
    email:{
        type:String,
        required:[true,"Email is Must For Signup Or Login"],
        unqiue:[true,"Choose Other Email"],
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true,"You Should Enter Password For Signup Or Login"],
        minlenght:[6,"Password Must Atleast 6 Characters Long"],
        maxlength:16,
    },
    cartItems: [
    {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    }
     }
    ],

    isVerified: {
        type: Boolean,
        default: false,
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    }
},{
    timestamps:true
});

AuthSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password =await bcrypt.hash(this.password,salt);
        next();
    } catch (error) {
        next(error)
    }
})

AuthSchema.methods.comparepassword = async function(password){
    return bcrypt.compare(password,this.password);
}
const Auth =  mongoose.model("Auth",AuthSchema);

export default Auth;
