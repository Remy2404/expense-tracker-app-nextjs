import {
  sortExpensesByRecency,
  sortExpensesByTransactionDateTime,
} from "@/lib/expenseSort";

describe("expenseSort (web)", () => {
  it("sorts by updated_at desc first even if transaction date is older", () => {
    const newerDateOlderUpdate = {
      id: "older-date",
      date: "2026-03-03T00:00:00.000Z",
      created_at: "2026-03-03T11:00:00.000Z",
      updated_at: "2026-03-03T10:00:00.000Z",
    };
    const olderDateNewerUpdate = {
      id: "newer-date",
      date: "2026-03-02T00:00:00.000Z",
      created_at: "2026-03-03T10:00:00.000Z",
      updated_at: "2026-03-03T11:00:00.000Z",
    };

    const result = sortExpensesByRecency([
      newerDateOlderUpdate,
      olderDateNewerUpdate,
    ]);
    expect(result.map((item) => item.id)).toEqual(["newer-date", "older-date"]);
  });

  it("uses created_at when updated_at ties", () => {
    const olderCreate = {
      id: "older-update",
      date: "2026-03-03T00:00:00.000Z",
      created_at: "2026-03-03T09:00:00.000Z",
      updated_at: "2026-03-03T10:01:00.000Z",
    };
    const newerCreate = {
      id: "newer-update",
      date: "2026-03-03T00:00:00.000Z",
      created_at: "2026-03-03T10:00:00.000Z",
      updated_at: "2026-03-03T10:01:00.000Z",
    };

    const result = sortExpensesByRecency([olderCreate, newerCreate]);
    expect(result.map((item) => item.id)).toEqual([
      "newer-update",
      "older-update",
    ]);
  });

  it("falls back to created_at and then id when date and updated_at tie", () => {
    const olderInsert = {
      id: "older-insert",
      date: "2026-03-03T00:00:00.000Z",
      created_at: "2026-03-03T10:00:00.000Z",
      updated_at: undefined,
    };
    const newerInsert = {
      id: "newer-insert",
      date: "2026-03-03T00:00:00.000Z",
      created_at: "2026-03-03T11:00:00.000Z",
      updated_at: undefined,
    };
    const sameTimeDifferentId = {
      id: "zzz",
      date: "2026-03-03T00:00:00.000Z",
      created_at: "2026-03-03T11:00:00.000Z",
      updated_at: undefined,
    };

    const result = sortExpensesByRecency([
      olderInsert,
      sameTimeDifferentId,
      newerInsert,
    ]);
    expect(result.map((item) => item.id)).toEqual([
      "zzz",
      "newer-insert",
      "older-insert",
    ]);
  });

  it("sorts by transaction datetime desc for recent transactions", () => {
    const newerDateOlderUpdate = {
      id: "newer-date",
      date: "2026-03-10T20:00:00.000Z",
      created_at: "2026-03-10T20:00:00.000Z",
      updated_at: "2026-03-10T20:00:00.000Z",
    };
    const olderDateNewerUpdate = {
      id: "older-date",
      date: "2026-03-09T20:00:00.000Z",
      created_at: "2026-03-09T20:00:00.000Z",
      updated_at: "2026-03-11T20:00:00.000Z",
    };

    const result = sortExpensesByTransactionDateTime([
      olderDateNewerUpdate,
      newerDateOlderUpdate,
    ]);
    expect(result.map((item) => item.id)).toEqual(["newer-date", "older-date"]);
  });

  it("uses updated_at as tie-breaker when transaction datetime is equal", () => {
    const olderUpdate = {
      id: "older-update",
      date: "2026-03-10T20:00:00.000Z",
      created_at: "2026-03-10T10:00:00.000Z",
      updated_at: "2026-03-10T11:00:00.000Z",
    };
    const newerUpdate = {
      id: "newer-update",
      date: "2026-03-10T20:00:00.000Z",
      created_at: "2026-03-10T09:00:00.000Z",
      updated_at: "2026-03-10T12:00:00.000Z",
    };

    const result = sortExpensesByTransactionDateTime([
      olderUpdate,
      newerUpdate,
    ]);
    expect(result.map((item) => item.id)).toEqual([
      "newer-update",
      "older-update",
    ]);
  });

  it("treats same UTC day as equal and falls back to audit timestamps", () => {
    const mobileLike = {
      id: "mobile-like",
      date: "2026-03-15T17:00:00.000Z",
      created_at: "2026-03-15T10:00:00.000Z",
      updated_at: "2026-03-15T10:00:00.000Z",
    };
    const webLike = {
      id: "web-like",
      date: "2026-03-15T00:00:00.000Z",
      created_at: "2026-03-15T10:05:00.000Z",
      updated_at: "2026-03-15T10:05:00.000Z",
    };

    const result = sortExpensesByTransactionDateTime([mobileLike, webLike]);
    expect(result.map((item) => item.id)).toEqual(["web-like", "mobile-like"]);
  });
});
