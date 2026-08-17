export interface ClientReview {
  id: string;
  name: string;
  message: string;
  rating: 1 | 2 | 3 | 4 | 5;
  profileImage: string | null;
  reviewImages: { type: "image" | "video"; url: string }[];
  createdAt: string;
}

export interface DesignRoom {
  room_id: number;
  client_id: string;
  room_name: string;
  created_at: string;
}

export interface DesignRevision {
  revision_id: number;
  room_id: number;
  revision_number: number;
  created_at: string;
}

export interface Design {
  id: number;
  designer_id: string;
  designer_name?: string;
  client_id: string;
  client_name: string;
  image_path: string | null;
  "2d_pdf_path"?: string | null;
  room_name: string;
  product_name: string;
  timestamp: string;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
  revision_id?: number;
}

export interface DesignComment {
  id: number;
  date: string;
  time: string;
  comment: string;
}

export interface Client {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: string;
}

export interface RoomWithLatestRevision {
  room_id: number;
  room_name: string;
  client_id: string;
  client_name: string;
  latest_revision: {
    revision_id: number;
    revision_number: number;
    created_at: string;
    designs: Design[];
  };
}

export interface RoomWithRevisions {
  room_id: number;
  room_name: string;
  client_id: string;
  client_name: string;
  revisions: {
    revision_id: number;
    revision_number: number;
    created_at: string;
    designs: Design[];
  }[];
  current_revision_count: number;
  can_upload: boolean;
}
