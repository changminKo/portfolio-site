import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useFlow, type ActivityComponentType } from "@stackflow/react";
import { useStackflowStatus } from "./StackflowStatus";

export const BookActivity: ActivityComponentType<"Book"> = ({ params }) => {
  const { push, pop } = useFlow();
  const { animate } = useStackflowStatus();
  return <AppScreen appBar={{ title: "책 상세" }}><div><button type="button" onClick={() => pop({ animate })}>서재로</button><h4>{params.title}</h4><p>Worker와 웹뷰 브릿지로 읽기 흐름을 지킵니다.</p><button type="button" onClick={() => push("Reader", params, { animate })}>읽기 시작</button></div></AppScreen>;
};
