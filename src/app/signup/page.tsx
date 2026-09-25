import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Signup() {
  return (
    <div className="w-full max-w-md space-y-4 p-8 md:p-10">
      <h2 className="text-2xl font-semibold text-foreground">Sign up</h2>
      <Input
        type="text"
        placeholder="Name"
        className="h-14 rounded-lg border border-input bg-background px-4 py-2 text-sm"
      />
      <Input
        id="email"
        type="email"
        placeholder="Email"
        className="h-14 rounded-lg border border-input bg-background px-4 py-2 text-sm"
      />
      <Button type="submit" className="w-full">
        Sign up
      </Button>
    </div>
  );
}
