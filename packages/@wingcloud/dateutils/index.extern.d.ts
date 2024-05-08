export default interface extern {
  addDays: (iso: string, days: number) => Promise<string>,
}
