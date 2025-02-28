import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Paste } from "@shared/schema";

export default function PastePage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();

  const {
    data: paste,
    isLoading,
  } = useQuery<Paste>({
    queryKey: [`/api/pastes/${id}`],
  });

  useEffect(() => {
    if (paste) {
      // Redirect to the plain text version
      window.location.href = `/api/pastes/${id}/raw`;
    }
  }, [paste, id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 text-primary">Loading...</div>
      </div>
    );
  }

  return null;
}