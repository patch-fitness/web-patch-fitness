import axios from "axios";
import { getGymId } from "@/utils/gymUtils";

const fetchMembersFromApi = async () => {
  const gymId = getGymId();
  const response = await axios.get(
    `http://localhost:5000/api/members${gymId ? `?gymId=${gymId}` : ""}`
  );
  return response.data || [];
};

const diffInDaysFromToday = (dateString) => {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export const getMonthlyJoined = async () => {
  const members = await fetchMembersFromApi();
  const now = new Date();
  const filtered = members.filter((member) => {
    if (!member.createdAt) return false;
    const createdAt = new Date(member.createdAt);
    if (Number.isNaN(createdAt.getTime())) return false;
    return (
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  });
  return { members: filtered };
};

export const threeDayExpire = async () => {
  const members = await fetchMembersFromApi();
  const filtered = members.filter((member) => {
    const diff = diffInDaysFromToday(member.nextBillDate);
    return diff !== null && diff >= 0 && diff <= 3;
  });
  return { members: filtered };
};

export const fourToSevenDaysExpire = async () => {
  const members = await fetchMembersFromApi();
  const filtered = members.filter((member) => {
    const diff = diffInDaysFromToday(member.nextBillDate);
    return diff !== null && diff >= 4 && diff <= 7;
  });
  return { members: filtered };
};

export const expired = async () => {
  const members = await fetchMembersFromApi();
  const filtered = members.filter((member) => {
    const diff = diffInDaysFromToday(member.nextBillDate);
    return diff !== null && diff < 0;
  });
  return { members: filtered };
};

export const inActiveMembers = async () => {
  const members = await fetchMembersFromApi();
  const filtered = members.filter(
    (member) => (member.status || "").toLowerCase() !== "active"
  );
  return { members: filtered };
};
