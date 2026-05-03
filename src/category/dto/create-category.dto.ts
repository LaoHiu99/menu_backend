export class CreateCategoryDto {
  title: string;
  sortOrder?: number;
  status?: number;
  /** 可选：挂到一级分类下的子类目 id */
  parentId?: number | null;
}