// The signers a viewer can choose between. Each is a rigged avatar from the
// Microsoft Rocketbox library (MIT), built into public/sign/avatars by
// scripts/sign-avatars. Their clothes are plain, as an interpreter's would
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

// The Data Lab replays signs with one signer, whose model is in
// public/sign/avatars.
export const CHARACTERS: Character[] = [avatar("okello", "Okello", "Denim jacket")];
