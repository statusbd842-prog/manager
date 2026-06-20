import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "./lib/supabase";

// Wire Supabase session token into every API call
setAuthTokenGetter(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});

createRoot(document.getElementById("root")!).render(<App />);
