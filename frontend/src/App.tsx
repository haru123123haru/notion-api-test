import { useRef } from "react";
import html2canvas from "html2canvas";

export const App = () => {
  const targetRef = useRef<HTMLDivElement>(null);

  const handleSendToNotion = async () => {
    if (!targetRef.current) return;

    try {
      // 1. 指定した要素をCanvas画像に変換
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "red",
      });

      // 2. Canvasをバイナリデータ(blob)に変換
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("画像の変換に失敗しました");
          return;
        }
        // 🔽🔽🔽 デバッグ用：自分のPCに画像をダウンロードしてみる 🔽🔽🔽
        const testUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = testUrl;
        a.download = "test-capture.png";
        a.click();
        // 🔼🔼🔼 ここまで 🔼🔼🔼

        try {
          // 3. FastAPIへ画像をアップロード
          //filenameが毎回同じだったので、バック側のcashを使ってしまい、スタイリングしても前のデータやりとりをしていたので、日時で無理やり変えた。
          //静的データの送信なら消せばいいが、動的ならuniqueになるようなUUIDとかを付けた方がいいかなー？
          const uniqueFilename = `screenshot-${Date.now()}.png`;
          const formData = new FormData();
          formData.append("file", blob, uniqueFilename);

          const uploadResponse = await fetch(
            "http://localhost:8000/api/upload-image",
            {
              method: "POST",
              body: formData,
            },
          );

          if (!uploadResponse.ok) throw new Error("アップロード失敗");

          const { imageUrl } = await uploadResponse.json();

          // 4. 発行されたURLを使ってNotion APIへ送信
          const notionResponse = await fetch(
            "http://localhost:8000/api/send-to-notion",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                page_id: "3140a1b2a348805bbe27d2a4b86e0950",
                image_url: imageUrl,
              }),
            },
          );

          if (!notionResponse.ok) throw new Error("Notion送信失敗");

          alert("Notionへの送信が完了しました！");
        } catch (apiError) {
          console.error("API通信エラー:", apiError);
          alert("サーバーとの通信でエラーが発生しました。");
        }
      }, "image/png");
    } catch (error) {
      console.error("キャプチャ処理に失敗しました", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* キャプチャ対象の要素 */}
      <div
        ref={targetRef}
        style={{
          padding: "20px",
          backgroundColor: "red",
          borderRadius: "10px",
          display: "inline-block",
        }}
      >
        <h2 style={{ color: "#333", margin: "0 0 10px 0" }}>
          Notion送信テスト
        </h2>
        <p style={{ margin: 0 }}>
          このUIが、そのまま画像としてNotionに送られます。
        </p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleSendToNotion}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Notionへ送る
        </button>
      </div>
    </div>
  );
};

export default App;
