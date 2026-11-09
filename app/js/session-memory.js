// Keep legacy last-session fields for backup compatibility and last-used ordering.
const practiceKey = (p) => JSON.stringify([p.id, p.questionIds]);
export function lessonMemory(db, programId) {
  return (
    db.lessonSessions?.[programId] ||
    (db.dailySession?.programId === programId ? db.dailySession : null)
  );
}
export function rememberLesson(db, checkpoint) {
  if (!checkpoint) return;
  db.lessonSessions = {
    ...db.lessonSessions,
    [checkpoint.programId]: checkpoint,
  };
  db.dailySession = checkpoint;
}
export function forgetLesson(db, programId) {
  const saved = { ...db.lessonSessions };
  delete saved[programId];
  db.lessonSessions = saved;
  if (db.dailySession?.programId === programId) db.dailySession = null;
}
export function bookMemory(db, programme, practice = false) {
  const legacy = db[practice ? "bookPracticeSession" : "bookSession"];
  return (
    db[practice ? "bookPracticeSessions" : "bookSessions"]?.[
      practice ? practiceKey(programme) : programme.id
    ] ||
    (legacy?.programId === programme.id &&
    (!practice ||
      JSON.stringify(legacy.practiceProgram?.questionIds) ===
        JSON.stringify(programme.questionIds))
      ? legacy
      : null)
  );
}
export function rememberBook(db, checkpoint) {
  const practice = Boolean(checkpoint.practice),
    field = practice ? "bookPracticeSessions" : "bookSessions";
  const key = practice
    ? practiceKey(checkpoint.practiceProgram)
    : checkpoint.programId;
  db[field] = { ...db[field], [key]: checkpoint };
  db[practice ? "bookPracticeSession" : "bookSession"] = checkpoint;
}
export function forgetBook(db,programId){
 const normal={...db.bookSessions};delete normal[programId];db.bookSessions=normal;
 db.bookPracticeSessions=Object.fromEntries(Object.entries(db.bookPracticeSessions||{}).filter(([,saved])=>saved.programId!==programId));
 for(const field of ['bookSession','bookPracticeSession'])if(db[field]?.programId===programId)db[field]=null;
}
