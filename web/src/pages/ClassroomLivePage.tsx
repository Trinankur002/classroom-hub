import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StudentClassroomLivePage } from "@/components/live/StudentClassroomLivePage";
import { TeacherClassroomLivePage } from "@/components/live/TeacherClassroomLivePage";
import { ClassroomLivePageProps } from "@/components/live/classroomLiveShared";

export default function ClassroomLivePage({
  classroomId: classroomIdProp,
  startPermissions,
  preJoinState,
  onLeavePage,
}: ClassroomLivePageProps) {
  const { classroomId: classroomIdParam } = useParams<{ classroomId: string }>();
  const location = useLocation();
  const classroomId = classroomIdProp || classroomIdParam;
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase?.() === "teacher";

  if (!classroomId) {
    return <div className="p-4">Select a classroom to start live class.</div>;
  }

  // Keep a single student live entry point via /live to avoid duplicated flows/UI.
  if (!isTeacher && location.pathname !== "/live") {
    return (
      <Navigate
        to="/live"
        replace
        state={{
          classroomId,
          preJoin: preJoinState?.preJoin,
        }}
      />
    );
  }

  if (isTeacher) {
    return (
      <TeacherClassroomLivePage
        classroomId={classroomId}
        startPermissions={startPermissions}
        onLeavePage={onLeavePage}
      />
    );
  }

  return (
    <StudentClassroomLivePage
      classroomId={classroomId}
      preJoinState={preJoinState}
      onLeavePage={onLeavePage}
    />
  );
}
