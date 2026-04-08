const authConfig = {
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: any) {
      if (nextUrl.pathname.startsWith("/panel")) {
        return !!auth?.user;
      }

      return true;
    },
  },
};

export default authConfig;
