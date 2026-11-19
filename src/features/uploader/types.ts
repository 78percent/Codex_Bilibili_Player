import type { SearchVideo } from '../video-search/types';

export type UploaderSummary = { mid: string; name: string; avatar: string; sign: string; followed?: boolean };
export type UploaderProfile = Omit<UploaderSummary, 'followed'> & {
  banner: string; followers: number | null; following: number | null; videoCount: number | null;
  followed: boolean | null; isSelf: boolean; official: string;
};
export type UploaderVideoPage = { videos: SearchVideo[]; page: number; pages: number; total: number };
export type UploaderCollection = { id: string; kind: 'season' | 'series'; title: string; cover: string; count: number };
export type UploaderCollectionPage = { items: UploaderCollection[]; page: number; pages: number; total: number };
export type UploaderPeoplePage = { items: UploaderSummary[]; page: number; pages: number; total: number };
export type UploaderDynamic = {
  id: string; author: UploaderSummary; text: string; publishedAt: string;
  images: string[]; video: SearchVideo | null; original: { author: string; text: string; images: string[]; video: SearchVideo | null } | null;
  likes: number; liked: boolean | null; comments: number; commentId: string; commentType: number; kind: string;
};
export type UploaderDynamicPage = { items: UploaderDynamic[]; offset: string; more: boolean };
export type UploaderComment = { id: string; author: UploaderSummary; message: string; likes: number; createdAt: number };
export type UploaderCommentPage = { items: UploaderComment[]; next: number; more: boolean };
export type UploaderTab = 'home' | 'videos' | 'dynamic' | 'collections';
