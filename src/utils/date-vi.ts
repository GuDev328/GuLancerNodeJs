export const DateVi = () => {
  const now = new Date();

  const vietnamOffset = 0 * 60;
  const localOffset = now.getTimezoneOffset();
  const vietnamTime = new Date(now.getTime() + (vietnamOffset - localOffset) * 60000);
  return vietnamTime;
};
