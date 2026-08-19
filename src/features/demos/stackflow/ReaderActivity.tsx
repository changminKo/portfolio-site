import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useFlow, type ActivityComponentType } from "@stackflow/react";
import { useStackflowStatus } from "./StackflowStatus";

export const ReaderActivity: ActivityComponentType<"Reader"> = ({ params }) => {
  const { pop } = useFlow();
  const { animate } = useStackflowStatus();
  return <AppScreen appBar={{ title: "리더" }}><div><button type="button" onClick={() => pop({ animate })}>책 상세로</button><h4>{params.title}</h4><p>1 / 24</p><p>왼쪽 가장자리에서 스와이프해 이전 화면으로 돌아가 보세요.</p></div></AppScreen>;
};
