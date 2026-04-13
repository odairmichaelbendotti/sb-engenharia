export function getInitials(name: string) {
  const nameSplit = name.split(" ");
  console.log(nameSplit);

  if (nameSplit.length > 1) {
    return (
      nameSplit[0].charAt(0) + nameSplit[nameSplit.length - 1].charAt(0)
    ).toUpperCase();
  }

  return (
    nameSplit[0].charAt(0).toUpperCase() + nameSplit[0].charAt(1).toUpperCase()
  );
}
