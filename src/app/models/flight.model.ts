export interface Flight {
  id: number;
  reservationId?: number;
  name: string;
  type: string;
  photo?: string;
  departure: string;
  duration: number;
  capacity: number;
  price: number;
  description: string;
  company: {
    id: number;
    name: string;
    logo_url?: string;
  };
}