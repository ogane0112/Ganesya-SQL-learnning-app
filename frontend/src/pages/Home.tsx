import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-2xl font-bold">SQL学習アプリ</h1>
      <p className="mt-3 text-slate-600">
        ブラウザ上でSQLを書いて、その場で実行しながら学べます。
        入力したSQLはあなたのブラウザ内だけで実行され、サーバーには送信されません。
      </p>
      <Link
        to="/problems"
        className="mt-6 inline-block min-h-[44px] rounded-lg bg-blue-600 px-6 py-3 font-medium text-white"
      >
        問題を解いてみる
      </Link>
    </div>
  );
}
