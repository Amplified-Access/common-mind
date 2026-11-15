// The signers a viewer can choose between. Each is a rigged avatar, built
// into public/sign/avatars by scripts/sign-avatars: from the Microsoft
// Rocketbox library (MIT), or from MakeHuman (CC0). Their clothes are plain, as an interpreter's would
// be, so the hands read clearly against them.

export type Character = {
  id: string;
  name: string;
  /** One line under the name in the picker. */
  look: string;
  /** The rigged model. */
  model: string;
  /** A head-and-shoulders picture for the picker. */
  portrait: string;
};

const avatar = (id: string, name: string, look: string): Character => ({
  id,
  name,
  look,
  model: `/sign/avatars/${id}.glb`,
  portrait: `/sign/avatars/${id}.webp`,
});

// Deeper skin tones first. The first is the default signer.
export const CHARACTERS: Character[] = [
  avatar("okello", "Okello", "Denim jacket"),
  avatar("achieng", "Achieng", "Afro, print top"),
  avatar("amani", "Amani", "Suit and tie"),
  avatar("nakato", "Nakato", "Dark blazer"),
  avatar("kato", "Kato", "Casual suit"),
];
