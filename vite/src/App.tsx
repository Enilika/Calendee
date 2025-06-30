/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, Edit3 } from "lucide-react";

type MarkType = null | "circle" | "cross" | "triangle";

interface DayData {
  date: Date;
  mark: MarkType;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayMarks, setDayMarks] = useState<{ [key: string]: MarkType }>({});
  const [crossReasons, setCrossReasons] = useState<{ [key: string]: string }>({});
  const [triangleReasons, setTriangleReasons] = useState<{ [key: string]: string }>({});
  const [holidays, setHolidays] = useState<{ [key: string]: string }>({});
  const [editingReason, setEditingReason] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"cross" | "triangle" | null>(null);
  const [reasonText, setReasonText] = useState("");
  const calendarRef = useRef<HTMLDivElement>(null);

  // 日付をローカル時間で文字列に変換（タイムゾーンずれを回避）
  const getDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 祝日データを取得
  useEffect(() => {
    fetchHolidays(currentDate.getFullYear());
  }, [currentDate]);

  const fetchHolidays = async (year: number) => {
    try {
      // 日本の祝日API（内閣府データ）を使用
      const response = await fetch(`https://holidays-jp.github.io/api/v1/${year}/date.json`);
      if (response.ok) {
        const holidayData = await response.json();
        setHolidays(holidayData);
      } else {
        // APIが利用できない場合のフォールバック
        console.warn("祝日APIにアクセスできません。フォールバックデータを使用します。");
        setHolidays(getFallbackHolidays(year));
      }
    } catch (error) {
      console.error("祝日データの取得に失敗しました:", error);
      // フォールバックデータを使用
      setHolidays(getFallbackHolidays(year));
    }
  };

  // フォールバック用の祝日データ（2025年）
  const getFallbackHolidays = (year: number): { [key: string]: string } => {
    if (year === 2025) {
      return {
        "2025-01-01": "元日",
        "2025-01-13": "成人の日",
        "2025-02-11": "建国記念の日",
        "2025-02-23": "天皇誕生日",
        "2025-03-20": "春分の日",
        "2025-04-29": "昭和の日",
        "2025-05-03": "憲法記念日",
        "2025-05-04": "みどりの日",
        "2025-05-05": "こどもの日",
        "2025-07-21": "海の日",
        "2025-08-11": "山の日",
        "2025-09-15": "敬老の日",
        "2025-09-23": "秋分の日",
        "2025-10-13": "スポーツの日",
        "2025-11-03": "文化の日",
        "2025-11-23": "勤労感謝の日",
      };
    }
    return {};
  };

  // 現在の月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  // const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // カレンダーの開始日（日曜日から開始）
  const startDate = new Date(firstDayOfMonth);
  const dayOfWeek = firstDayOfMonth.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  // カレンダーの日付配列を生成
  const generateCalendarDays = (): DayData[] => {
    const days: DayData[] = [];
    const currentDateObj = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateKey = getDateKey(currentDateObj);
      days.push({
        date: new Date(currentDateObj),
        mark: dayMarks[dateKey] || null,
      });
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // 日付のマークを切り替え
  const toggleMark = (date: Date) => {
    const dateKey = getDateKey(date);
    const currentMark = dayMarks[dateKey];

    let newMark: MarkType;
    if (currentMark === null || currentMark === undefined) {
      newMark = "circle";
    } else if (currentMark === "circle") {
      newMark = "cross";
    } else if (currentMark === "cross") {
      newMark = "triangle";
    } else {
      newMark = null;
      // マークを削除する場合は理由も削除
      setCrossReasons((prev) => {
        const newReasons = { ...prev };
        delete newReasons[dateKey];
        return newReasons;
      });
      setTriangleReasons((prev) => {
        const newReasons = { ...prev };
        delete newReasons[dateKey];
        return newReasons;
      });
    }

    setDayMarks((prev) => ({
      ...prev,
      [dateKey]: newMark,
    }));
  };

  // 前の月に移動
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // 次の月に移動
  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // 日本の祝日かどうかチェック
  const isJapaneseHoliday = (date: Date): string | null => {
    const dateKey = getDateKey(date);
    return holidays[dateKey] || null;
  };

  // 現在の月かどうかチェック
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 今日かどうかチェック
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 理由の編集を開始
  const startEditingReason = (dateKey: string, type: "cross" | "triangle") => {
    setEditingReason(dateKey);
    setEditingType(type);
    if (type === "cross") {
      setReasonText(crossReasons[dateKey] || "");
    } else {
      setReasonText(triangleReasons[dateKey] || "");
    }
  };

  // 理由の保存
  const saveReason = () => {
    if (editingReason && editingType) {
      if (editingType === "cross") {
        setCrossReasons((prev) => ({
          ...prev,
          [editingReason]: reasonText,
        }));
      } else {
        setTriangleReasons((prev) => ({
          ...prev,
          [editingReason]: reasonText,
        }));
      }
      setEditingReason(null);
      setEditingType(null);
      setReasonText("");
    }
  };

  // 理由の編集をキャンセル
  const cancelEditingReason = () => {
    setEditingReason(null);
    setEditingType(null);
    setReasonText("");
  };

  // ✕マークがある日付のリストを取得
  const getCrossMarkedDays = () => {
    return Object.entries(dayMarks)
      .filter(([_, mark]) => mark === "cross")
      .map(([dateKey, _]) => {
        const date = new Date(dateKey);
        return {
          dateKey,
          date,
          reason: crossReasons[dateKey] || "",
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // △マークがある日付のリストを取得
  const getTriangleMarkedDays = () => {
    return Object.entries(dayMarks)
      .filter(([_, mark]) => mark === "triangle")
      .map(([dateKey, _]) => {
        const date = new Date(dateKey);
        return {
          dateKey,
          date,
          reason: triangleReasons[dateKey] || "",
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };


  const uint8ToBase64 = (bytes: Uint8Array): string => {
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  };

  // 画像としてエクスポート
  const exportAsImage = async () => {
    if (!calendarRef.current) return;

    try {
      const svgData = createSVGFromCalendar();
      const bytes = new TextEncoder().encode(svgData);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      canvas.width = 1000;
      canvas.height = 800;

      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const link = document.createElement("a");
          link.download = `calendar-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
            2,
            "0"
          )}.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      };

      img.src = "data:image/svg+xml;base64," + uint8ToBase64(bytes);
    } catch (error) {
      console.error("Export failed:", error);
      alert("エクスポートに失敗しました");
    }
  };

  // SVGデータを作成
  const createSVGFromCalendar = (): string => {
    const monthName = currentDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
    const crossDays = getCrossMarkedDays();
    const triangleDays = getTriangleMarkedDays();

    let svg = `<svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="800" fill="white"/>
      <text x="400" y="40" text-anchor="middle" font-size="24" font-weight="bold">${monthName}</text>`;

    // 曜日ヘッダー（日曜日から土曜日）
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    weekdays.forEach((day, index) => {
      svg += `<text x="${
        50 + index * 100
      }" y="80" text-anchor="middle" font-size="16" font-weight="bold">${day}</text>`;
    });

    // カレンダーの日付
    calendarDays.forEach((dayData, index) => {
      const row = Math.floor(index / 7);
      const col = index % 7;
      const x = 10 + col * 100;
      const y = 120 + row * 70;

      const isCurrentMonthDay = isCurrentMonth(dayData.date);
      const holiday = isJapaneseHoliday(dayData.date);
      const dayOfWeek = dayData.date.getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;

      // 背景
      let fillColor = "white";
      if (holiday) fillColor = "#fef2f2";
      else if (isSunday) fillColor = "#fef2f2";
      else if (isSaturday) fillColor = "#eff6ff";

      svg += `<rect x="${x}" y="${y - 25}" width="90" height="60" fill="${fillColor}" stroke="#e5e7eb"/>`;

      // 日付テキスト
      let textColor = isCurrentMonthDay ? "black" : "#9ca3af";
      if (holiday || (isSunday && isCurrentMonthDay)) textColor = "#dc2626";
      if (isSaturday && isCurrentMonthDay && !holiday) textColor = "#2563eb";

      svg += `<text x="${
        x + 45
      }" y="${y}" text-anchor="middle" font-size="14" fill="${textColor}">${dayData.date.getDate()}</text>`;

      // マーク
      if (dayData.mark === "circle") {
        svg += `<circle cx="${x + 45}" cy="${y + 15}" r="8" fill="none" stroke="#22c55e" stroke-width="2"/>`;
      } else if (dayData.mark === "cross") {
        svg += `<path d="M${x + 37},${y + 7} L${x + 53},${y + 23} M${x + 53},${y + 7} L${x + 37},${
          y + 23
        }" stroke="#ef4444" stroke-width="2"/>`;
      } else if (dayData.mark === "triangle") {
        svg += `<path d="M${x + 45},${y + 7} L${x + 37},${y + 23} L${x + 53},${
          y + 23
        } Z" fill="none" stroke="#f59e0b" stroke-width="2"/>`;
      }
    });

    // ✕理由リスト
    let reasonListY = 120;
    if (crossDays.length > 0) {
      svg += `<text x="750" y="${reasonListY}" font-size="18" font-weight="bold">✕の理由</text>`;
      reasonListY += 30;
      crossDays.forEach((crossDay, index) => {
        const y = reasonListY + index * 25;
        const dateStr = `${crossDay.date.getMonth() + 1}/${crossDay.date.getDate()}`;
        svg += `<text x="750" y="${y}" font-size="14">${dateStr}: ${crossDay.reason || "理由未記入"}</text>`;
      });
      reasonListY += crossDays.length * 25 + 20;
    }

    // △理由リスト
    if (triangleDays.length > 0) {
      svg += `<text x="750" y="${reasonListY}" font-size="18" font-weight="bold">△の理由</text>`;
      reasonListY += 30;
      triangleDays.forEach((triangleDay, index) => {
        const y = reasonListY + index * 25;
        const dateStr = `${triangleDay.date.getMonth() + 1}/${triangleDay.date.getDate()}`;
        svg += `<text x="750" y="${y}" font-size="14">${dateStr}: ${triangleDay.reason || "理由未記入"}</text>`;
      });
    }

    svg += "</svg>";
    return svg;
  };

  const crossMarkedDays = getCrossMarkedDays();
  const triangleMarkedDays = getTriangleMarkedDays();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="flex gap-6">
        {/* メインカレンダー */}
        <div className="flex-1">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={goToPreviousMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>

            <h1 className="text-2xl font-bold">
              {currentDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}
            </h1>

            <div className="flex gap-2">
              <button
                onClick={exportAsImage}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                title="画像としてエクスポート"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm">エクスポート</span>
              </button>

              <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* カレンダー */}
          <div ref={calendarRef} className="bg-white rounded-lg shadow-lg p-4">
            {/* 曜日ヘッダー（日曜日から土曜日） */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
                <div
                  key={day}
                  className={`p-3 text-center font-semibold ${
                    index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayData, index) => {
                const isCurrentMonthDay = isCurrentMonth(dayData.date);
                const holiday = isJapaneseHoliday(dayData.date);
                const isTodayDate = isToday(dayData.date);
                const dayOfWeek = dayData.date.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;

                return (
                  <div
                    key={index}
                    onClick={() => toggleMark(dayData.date)}
                    className={`
                      relative h-16 p-2 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-50
                      ${!isCurrentMonthDay ? "text-gray-400 bg-gray-50" : ""}
                      ${holiday ? "bg-red-50 text-red-700" : ""}
                      ${isSunday && isCurrentMonthDay && !holiday ? "text-red-600 bg-red-50" : ""}
                      ${isSaturday && isCurrentMonthDay && !holiday ? "text-blue-600 bg-blue-50" : ""}
                      ${isTodayDate ? "bg-yellow-100 border-yellow-300" : ""}
                      ${dayData.mark === "circle" ? "bg-green-50" : ""}
                      ${dayData.mark === "cross" ? "bg-red-100" : ""}
                      ${dayData.mark === "triangle" ? "bg-yellow-50" : ""}
                    `}
                  >
                    <div className="text-sm font-medium">{dayData.date.getDate()}</div>

                    {holiday && <div className="text-xs text-red-600 truncate mt-1">{holiday}</div>}

                    {/* マーク表示 */}
                    <div className="absolute bottom-1 right-1">
                      {dayData.mark === "circle" && (
                        <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
                          <span className="text-green-500 text-lg font-bold">○</span>
                        </div>
                      )}
                      {dayData.mark === "cross" && (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <span className="text-red-500 text-lg font-bold">✕</span>
                        </div>
                      )}
                      {dayData.mark === "triangle" && (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <span className="text-yellow-600 text-lg font-bold">△</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 説明 */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            日付をクリックして○×△を切り替えできます（○ → ✕ → △ → なし → ○...）
          </div>
        </div>

        {/* 理由入力エリア */}
        <div className="w-80 bg-gray-50 rounded-lg p-4 space-y-6">
          {/* ✕理由入力エリア */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-red-500">✕</span>
              理由メモ
            </h2>

            {crossMarkedDays.length === 0 ? (
              <p className="text-gray-500 text-sm">✕マークの日付がありません</p>
            ) : (
              <div className="space-y-3">
                {crossMarkedDays.map((crossDay) => (
                  <div key={crossDay.dateKey} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {crossDay.date.getMonth() + 1}/{crossDay.date.getDate()}(
                        {["日", "月", "火", "水", "木", "金", "土"][crossDay.date.getDay()]})
                      </span>
                      <button
                        onClick={() => startEditingReason(crossDay.dateKey, "cross")}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="理由を編集"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {editingReason === crossDay.dateKey && editingType === "cross" ? (
                      <div className="space-y-2">
                        <textarea
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
                          rows={3}
                          placeholder="理由を入力してください..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveReason}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEditingReason}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{crossDay.reason || "理由未記入"}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* △理由入力エリア */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-600">△</span>
              理由メモ
            </h2>

            {triangleMarkedDays.length === 0 ? (
              <p className="text-gray-500 text-sm">△マークの日付がありません</p>
            ) : (
              <div className="space-y-3">
                {triangleMarkedDays.map((triangleDay) => (
                  <div key={triangleDay.dateKey} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {triangleDay.date.getMonth() + 1}/{triangleDay.date.getDate()}(
                        {["日", "月", "火", "水", "木", "金", "土"][triangleDay.date.getDay()]})
                      </span>
                      <button
                        onClick={() => startEditingReason(triangleDay.dateKey, "triangle")}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="理由を編集"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {editingReason === triangleDay.dateKey && editingType === "triangle" ? (
                      <div className="space-y-2">
                        <textarea
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
                          rows={3}
                          placeholder="理由を入力してください..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveReason}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEditingReason}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{triangleDay.reason || "理由未記入"}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
