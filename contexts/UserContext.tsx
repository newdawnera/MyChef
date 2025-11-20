// contexts/UserContext.tsx
import React, { createContext, useContext, useState } from "react";

// Define the shape of the data and functions the context provides
type UserContextType = {
  name: string;
  email: string;
  avatar: string | null;
  /** Updates the user's name and email globally. */
  updateProfile: (name: string, email: string) => void;
  /** Updates the user's avatar image URI globally. */
  updateAvatar: (uri: string) => void;
};

// Create the context object
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider Component to wrap the app
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Global State for User Data
  const [name, setName] = useState("Sarah Johnson");
  const [email, setEmail] = useState("sarah.johnson@email.com");
  const [avatar, setAvatar] = useState<string | null>(null);

  const updateProfile = (newName: string, newEmail: string) => {
    setName(newName);
    setEmail(newEmail);
  };

  const updateAvatar = (uri: string) => {
    setAvatar(uri);
  };

  return (
    <UserContext.Provider
      value={{ name, email, avatar, updateProfile, updateAvatar }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom Hook to consume the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    // This throws an error if the hook is called outside the UserProvider wrapper
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
