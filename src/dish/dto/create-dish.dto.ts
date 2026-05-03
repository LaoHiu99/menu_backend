export class CreateDishDto {
  categoryId: number;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  status?: number;
  /** 越小越靠前 */
  sortOrder?: number;
}