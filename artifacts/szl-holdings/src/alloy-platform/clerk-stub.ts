const stubUser = {
  id: "demo-user",
  firstName: "Stephen",
  fullName: "Stephen Lutar",
  imageUrl: null as string | null,
  primaryEmailAddress: { emailAddress: "stephen@szlholdings.com" },
};

export function useUser() {
  return { user: stubUser, isSignedIn: true, isLoaded: true };
}

export function useClerk() {
  return {
    signOut: () => Promise.resolve(),
    addListener: (_cb: unknown) => () => {},
  };
}
