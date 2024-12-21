const UserModel = require("../models/userModel");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2");
const ProfileModel = require("../models/profileModel");

passport.serializeUser((user,done)=>{
    done(null,user)
})

passport.deserializeUser(async (id,done) => {
    try {
        const user = await UserModel.findById({_id:id});
        if(!user){
            done(null,null)
        }
        done(null,user)
    } catch (error) {
        done(error, null)
    }
})

module.exports = passport.use(

    // ================ Google Strategy ================ //
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       // callbackURL: "https://tradeet.onrender.com/api/v1/auth/google/callback",
         callbackURL: "http://localhost:3000/api/user/google/callback",
        passReqToCallback: true,
        scope: ['profile', 'email']
    },async (_req,_accessToken,_refreshToken, profile,done) => {
        
        try {
            const user = await UserModel.findOne({email:profile.email});
            if(!user){
                const {name, email,picture} = profile._json;
                const newUser = await UserModel.create({fullname:name, email,provider:"Google",avatar:picture,verified:true});
                await ProfileModel.create({user:newUser._id});
                return done(null,newUser._id.toString())
            }
            return done(null,user?._id.toString())
        } catch (error) {
            done(error,null)
        }
    })

)