import passportLocal from "passport-local";
import bcrypt from "bcrypt";

const localStrategy = passportLocal.Strategy;

export function initialize(passport, getUserByUsername, getUser){

    const authenticateUser = async (username, password, done) => {
        const user = await getUserByUsername(username);
        console.log(password);
        if (user == null) {
            return done(null, false, {message:"No user with that username"});
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null,user);
            }else{
                return done(null, false, {message:"Passwpord incorrect"});
            }
        } catch (error) {
            return done (error);
        }
    }

    passport.use(new localStrategy(authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (user, done) => {
        try {
            const _user = await getUser(user.id);
            return done(null, _user);
        } catch (error) {
            return done(error, null);
        }
    });
}
