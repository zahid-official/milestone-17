/* eslint-disable @typescript-eslint/no-explicit-any */
import passport from "passport";
import User from "../modules/user/user.model";
import { AccountStatus } from "../modules/user/user.interface";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

// Configure local strategy for email and password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },

    // Verify callback
    async (email: string, password: string, done: any) => {
      try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "User does not exist" });
        }

        // Check if user is verified
        if (!user.isVerified) {
          return done(null, false, {
            message: `User is not verified. Please verify your email to proceed.`,
          });
        }

        // Check if user is blocked or inactive
        if (
          user.accountStatus === AccountStatus.BLOCKED ||
          user.accountStatus === AccountStatus.INACTIVE
        ) {
          return done(null, false, {
            message: `User is ${user.accountStatus}. Please contact support for more information.`,
          });
        }

        // Check if user is deleted
        if (user.isDeleted) {
          return done(null, false, {
            message: `User is deleted. Please contact support for more information.`,
          });
        }

        // Compare password with database stored password
        const isPasswordMatched = await bcrypt.compare(
          password,
          user.password as string
        );
        if (!isPasswordMatched) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

// Serialize user
passport.serializeUser(
  (user: any, done: (error: any, id?: unknown) => void) => {
    done(null, user._id);
  }
);

// Deserialize user
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
