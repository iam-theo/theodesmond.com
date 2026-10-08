export const EMOJIS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Haha" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
]

export function viewerKey() {
  if (typeof window === "undefined") return "guest"
  let key = localStorage.getItem("td-commenter")
  if (!key) {
    key = Math.random().toString(36).slice(2, 12)
    localStorage.setItem("td-commenter", key)
  }
  return key
}

export function maskEmail(email) {
  if (!email) return ""
  const at = email.indexOf("@")
  if (at <= 0) return "***"
  const user = email.slice(0, at).slice(0, 2) + "***"
  const domain = email.slice(at + 1)
  const [dom, tld = ""] = domain.split(".")
  const maskedDomain = (dom.slice(0, 2) + "***") + (tld ? "." + tld : "")
  return `${user}@${maskedDomain}`
}

export function applyReaction(comment, emoji, key) {
  const reactions = { ...(comment.reactions || {}) }
  const viewer = { ...(comment.viewer || {}) }

  if (viewer[emoji] === key) {
    reactions[emoji] = (reactions[emoji] || 1) - 1
    if (reactions[emoji] <= 0) delete reactions[emoji]
    delete viewer[emoji]
    return { reactions, viewer }
  }

  for (const e of Object.keys(viewer)) {
    if (viewer[e] === key) {
      reactions[e] = (reactions[e] || 1) - 1
      if (reactions[e] <= 0) delete reactions[e]
      delete viewer[e]
    }
  }
  reactions[emoji] = (reactions[emoji] || 0) + 1
  viewer[emoji] = key
  return { reactions, viewer }
}
