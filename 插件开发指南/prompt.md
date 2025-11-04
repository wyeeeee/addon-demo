# 请阅读knowledges文件夹内相关文档，实现一个钉钉ai表格侧边栏插件
## 插件需求
- 提供一个下拉选择框，选择数据表（默认为第一个数据表）
- 提供一个日期选择，可以选择一天或一个时间段内日期
- 提供一个确定按钮
- 当用户选择数据表与日期，点击确认按钮后，程序请求后端数据（2025/11/04 09:16:06 服务启动在 http://localhost:8080
2025/11/04 09:16:06 API端点: http://localhost:8080/api/product-daily-view
2025/11/04 09:16:06 使用示例:
2025/11/04 09:16:06   单日期查询: http://localhost:8080/api/product-daily-view?date=2025-10-31
2025/11/04 09:16:06   日期范围查询: http://localhost:8080/api/product-daily-view?start_date=2025-10-01&end_date=2025-10-31
响应格式:
{
  "code": 0,
  "msg": "成功",
  "data": [...]
，数据models如下
package models

import "time"

// ProductDailyView 商品日报视图模型
type ProductDailyView struct {
	Date                      time.Time `gorm:"column:日期" json:"date"`
	ProductID                 string    `gorm:"column:商品ID" json:"product_id"`
	ProductInfo               string    `gorm:"column:商品信息" json:"product_info"`
	MerchantCode              string    `gorm:"column:商家编码" json:"merchant_code"`
	ItemNo                    string    `gorm:"column:货号" json:"item_no"`
	PublishTime               string    `gorm:"column:发布时间" json:"publish_time"`
	CategoryLevel5            string    `gorm:"column:五级分类" json:"category_level5"`
	YearSeason                string    `gorm:"column:年份季节" json:"year_season"`
	Cost                      float64   `gorm:"column:成本" json:"cost"`
	Price                     float64   `gorm:"column:价格" json:"price"`
	IsIdeal                   string    `gorm:"column:是否理想裤" json:"is_ideal"`
	Operator                  string    `gorm:"column:运营人员" json:"operator"`
	LinkType                  string    `gorm:"column:主副链接类型" json:"link_type"`
	PreSeasonStatus           string    `gorm:"column:季前判定" json:"pre_season_status"`
	Grade                     string    `gorm:"column:等级" json:"grade"`
	VisitorCount              int       `gorm:"column:商品访客数" json:"visitor_count"`
	PaymentBuyerCount         int       `gorm:"column:支付买家数" json:"payment_buyer_count"`
	PaymentItemCount          int       `gorm:"column:支付件数" json:"payment_item_count"`
	PaymentAmount             float64   `gorm:"column:支付金额" json:"payment_amount"`
	RefundAmount              float64   `gorm:"column:成功退款金额" json:"refund_amount"`
	FavoriteCount             int       `gorm:"column:商品收藏人数" json:"favorite_count"`
	CartItemCount             int       `gorm:"column:商品加购件数" json:"cart_item_count"`
	AvgStayDuration           float64   `gorm:"column:平均停留时长" json:"avg_stay_duration"`
	BounceRate                float64   `gorm:"column:商品详情页跳出率" json:"bounce_rate"`
	SearchConversionRate      float64   `gorm:"column:搜索引导支付转化率" json:"search_conversion_rate"`
	SearchVisitorCount        int       `gorm:"column:搜索引导访客数" json:"search_visitor_count"`
	SearchBuyerCount          int       `gorm:"column:搜索引导支付买家数" json:"search_buyer_count"`
	TotalImpressionCount      int       `gorm:"column:展现数" json:"total_impression_count"`
	TotalClickCount           int       `gorm:"column:点击数" json:"total_click_count"`
	TotalOrderCount           int       `gorm:"column:总订单行" json:"total_order_count"`
	TotalOrderAmount          float64   `gorm:"column:总订单金额" json:"total_order_amount"`
	TotalCartCountSum         int       `gorm:"column:总购物车数" json:"total_cart_count_sum"`
	TotalFavoriteCountSum     int       `gorm:"column:总收藏数" json:"total_favorite_count_sum"`
	TotalDirectDealCount      int       `gorm:"column:直接订单行" json:"total_direct_deal_count"`
	TotalDirectDealAmount     float64   `gorm:"column:直接订单金额" json:"total_direct_deal_amount"`
	TotalDirectCartCount      int       `gorm:"column:直接购物车数" json:"total_direct_cart_count"`
	TotalCost                 float64   `gorm:"column:总费用" json:"total_cost"`
	SupplementItemCount       int       `gorm:"column:补单件数" json:"supplement_item_count"`
	SupplementAmount          float64   `gorm:"column:补单营业额" json:"supplement_amount"`
	LiveDealItemCount         int       `gorm:"column:直播带货支付件数" json:"live_deal_item_count"`
	LiveDealUserCount         int       `gorm:"column:直播带货支付买家数" json:"live_deal_user_count"`
	LiveDealAmount            float64   `gorm:"column:直播带货营业额" json:"live_deal_amount"`
	RealPaymentItemCount      int       `gorm:"column:真实支付件数" json:"real_payment_item_count"`
	RealPaymentBuyerCount     int       `gorm:"column:真实支付买家数" json:"real_payment_buyer_count"`
	RealConversion            float64   `gorm:"column:真实转化" json:"real_conversion"`
	RealCartRate              float64   `gorm:"column:真实加购率" json:"real_cart_rate"`
	RealSearchConversionRate  float64   `gorm:"column:搜索引导支付转化率_真实" json:"real_search_conversion_rate"`
	SearchRatio               float64   `gorm:"column:搜索占比" json:"search_ratio"`
	RefundRate                float64   `gorm:"column:退款率" json:"refund_rate"`
	RealRevenue               float64   `gorm:"column:真实营业额" json:"real_revenue"`
	PaidRatio                 float64   `gorm:"column:付费占比" json:"paid_ratio"`
	TotalROI                  float64   `gorm:"column:总ROI" json:"total_roi"`
	DirectROI                 float64   `gorm:"column:直接ROI" json:"direct_roi"`
	AvgClickCost              float64   `gorm:"column:平均点击成本" json:"avg_click_cost"`
	TotalCartCost             float64   `gorm:"column:总加购成本" json:"total_cart_cost"`
	TotalFavoriteCost         float64   `gorm:"column:总收藏成本" json:"total_favorite_cost"`
	ClickRate                 float64   `gorm:"column:点击率" json:"click_rate"`
	TotalConversionRate       float64   `gorm:"column:总转化率" json:"total_conversion_rate"`
	DirectConversionRate      float64   `gorm:"column:直接转化率" json:"direct_conversion_rate"`
	TotalCartRate             float64   `gorm:"column:总加购率" json:"total_cart_rate"`
	DirectCartRate            float64   `gorm:"column:直接加购率" json:"direct_cart_rate"`
	AssociatedSalesRatio      float64   `gorm:"column:关联销售占比" json:"associated_sales_ratio"`
}

// TableName 指定表名
func (ProductDailyView) TableName() string {
	return "product_daily_view"
}
}）示例如上，然后删除当前表内所有数据（注意删除限制最高单次100行，要分段删除），然后将获取到的新数据全部新增到表内（注意字段匹配，原表字段与当前表字段可能不一致）
- 注意界面美观，注意代码文件组织合理