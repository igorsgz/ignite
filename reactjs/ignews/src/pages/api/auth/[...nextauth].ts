import NextAuth from "next-auth";
import Providers from "next-auth/providers";

import { query as q } from "faunadb";
import { fauna } from "../../../service/fauna";

export default NextAuth({
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: "read:user",
    }),
  ],
  callbacks: {
    async signIn(user, account, profile) {
      const { email } = user;

      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                // condition
                q.Match(q.Index("user_by_email"), q.Casefold(user.email))
              )
            ),
            // true
            q.Create(q.Collection("users"), { data: { email } }),
            //false
            q.Get(q.Match(q.Index("user_by_email"), q.Casefold(user.email)))
          )
        );
        return true;
      } catch {
        return false;
      }
    },
  },
});
