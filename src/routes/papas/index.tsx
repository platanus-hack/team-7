import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { OnboardingDataWithId } from "@/components/types/onboarding";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { queryClient } from "@/client";
import { NavBar } from "@/components/navbar";

export const Route = createFileRoute("/papas/")({
  component: RouteComponent,
  loader: async () => {
    await queryClient.ensureQueryData(convexQuery(api.lessons.list, {}));
  },
});

function RouteComponent() {
  const createLesson = useConvexMutation(api.lessons.create);
  const navigate = Route.useNavigate();
  const [selectedChild, setSelectedChild] = React.useState("");
  const [children, setChildren] = React.useState<OnboardingDataWithId[]>(() => 
    JSON.parse(localStorage.getItem("onboardingData") || "[]")
  );

  const toggleSelectedChild = (childId: string) => {
    setSelectedChild(prev => prev === childId ? "" : childId);
  };

  const createLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: async ({ lessonId }) => {
      await navigate({ to: "$lessonId", params: { lessonId } });
    },
  });

  const deleteChild = (childId: string) => {
    const updatedChildren = children.filter(child => child.id !== childId);
    localStorage.setItem("onboardingData", JSON.stringify(updatedChildren));
    setChildren(updatedChildren);
    if (selectedChild === childId) {
      setSelectedChild("");
    }
  };

  const selectedChildData = children.find((child: OnboardingDataWithId) => child.id === selectedChild);

  const { data: lessons } = useSuspenseQuery(convexQuery(api.lessons.list, {}));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <NavBar/>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Create a Lesson</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {children.map((child: OnboardingDataWithId) => (
          <div
            key={child.id}
            onClick={() => toggleSelectedChild(child.id)}
            className={`
              cursor-pointer rounded-xl p-6 transition-all duration-200 h-54 relative
              ${
                selectedChild === child.id
                  ? "bg-sky-500 !text-white shadow-lg scale-101"
                  : "bg-white text-gray-800 border hover:shadow-md"
              }
            `}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteChild(child.id);
              }}
              className="absolute top-0 right-1 p-2  hover:text-red-700 transition-colors hover:cursor-pointer"
            >
             x
            </button>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold capitalize font-fraunces">{child.childName}</span>
                <span className="text-sm px-3 py-1 rounded-full bg-opacity-20 ">{child.gradeLevel}</span>
              </div>

              <div className={`space-y-2 ${selectedChild === child.id ? "text-sky-50" : "text-gray-600"}`}>
                <p className="text-sm">
                  <span className="font-medium">Interests:</span> {child.interests}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Topics:</span> {child.topics.join(", ")}
                </p>
              </div>

              {selectedChild === child.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createLessonMutation.mutate({
                      parentContextDescription: `Learning plan for ${child.childName}: Grade ${child.gradeLevel}, Interests: ${child.interests}, Topics: ${child.topics.join(", ")}`,
                      name: child.childName || "",
                    });
                  }}
                  className="w-full mt-4 py-2 bg-white text-sky-500 rounded-lg hover:bg-sky-50 transition-colors font-medium hover:cursor-pointer"
                >
                  Crear lección
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="p-2">
          <h3>Lecciones que tienes</h3>
          {lessons.map((lesson) => (
            <div key={lesson._id} className="p-2 border-b">
              <div>{lesson.lessonGoalDescription}</div>

              <Link from={Route.fullPath} to="/papas/$lessonId" params={{ lessonId: lesson._id }} className="underline">
                Ir a la lección
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}