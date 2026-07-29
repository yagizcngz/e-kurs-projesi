import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/istekler")({
  component: RequestsPage,
});

interface TeachingRequest {
  id: number;
  courseId: number;
  courseTitle: string;
  teacherId: number;
  teacherName: string;
  status: string;
  createdAt: string;
}

function RequestsPage() {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState<TeachingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      if (!token) return;

      const res = await fetch("http://localhost:5157/api/teachingrequests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`http://localhost:5157/api/teachingrequests/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Request approved.");
        fetchRequests();
      } else {
        toast.error("Failed to approve request.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`http://localhost:5157/api/teachingrequests/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Request rejected.");
        fetchRequests();
      } else {
        toast.error("Failed to reject request.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  return (
    <>
      <PageHeader crumb={t("sidebar.pendingRequests")} />

      <div className="p-4 md:p-8 animate-reveal">
        {loading ? (
          <div className="text-center text-muted-foreground p-8">Yükleniyor...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">Bekleyen istek bulunmuyor.</div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{request.teacherName}</div>
                    <div className="text-sm text-muted-foreground">
                      Kurs:{" "}
                      <span className="font-medium text-foreground">
                        {i18n.exists(`dynamic.courses.${(request.courseTitle || "").trim()}`)
                          ? t(`dynamic.courses.${(request.courseTitle || "").trim()}`)
                          : request.courseTitle}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tarih: {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {request.status === "Pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(request.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Kabul Et
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" /> Reddet
                        </Button>
                      </>
                    ) : (
                      <Badge variant={request.status === "Accepted" ? "default" : "destructive"}>
                        {request.status === "Accepted" ? "Kabul Edildi" : "Reddedildi"}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
