import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useFlow, type ActivityComponentType } from "@stackflow/react";
import { useStackflowStatus } from "./StackflowStatus";

const books = [
  { bookId: "perf", title: "브라우저 성능 읽기" },
  { bookId: "webview", title: "웹뷰 경계 설계" },
  { bookId: "viewer", title: "콘텐츠 뷰어 구조" },
] as const;

export const ShelfActivity: ActivityComponentType<"Shelf"> = () => {
  const { push } = useFlow();
  const { animate } = useStackflowStatus();
  return <AppScreen appBar={{ title: "서재" }}><div><h4>내 서재</h4>{books.map((book) => <button key={book.bookId} type="button" onClick={() => push("Book", book, { animate })}>{book.title}</button>)}</div></AppScreen>;
};
