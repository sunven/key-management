## MODIFIED Requirements

### Requirement: 提供商-令牌数据完整性

系统 SHALL 在统一界面中显示提供商和令牌时,维护所有现有的安全控制、用户隔离和数据关系,并使用 Prisma ORM 执行所有数据库操作。

#### Scenario: 统一视图中的用户隔离

- **WHEN** 用户访问统一的提供商-令牌页面
- **THEN** 仅显示已认证用户拥有的提供商(通过 Prisma 查询过滤)
- **AND** 仅显示属于用户提供商的令牌(通过 Prisma 关系查询)
- **AND** 其他用户的数据不可访问

#### Scenario: 级联删除感知

- **WHEN** 用户删除具有关联令牌的提供商
- **THEN** 警告消息指示所有关联的令牌将被删除
- **AND** 确认后,提供商及其令牌都被移除(通过 Prisma 的 CASCADE 外键约束)
- **AND** 此行为与先前的实现保持不变

#### Scenario: 无提供商选择的令牌创建

- **WHEN** 用户尝试从统一视图添加令牌
- **THEN** 如果从顶层"添加令牌"按钮访问,令牌对话框可能仍需要提供商选择
- **OR** 如果从展开的提供商区域内访问,提供商已预选
- **AND** 用户不能为他们不拥有的提供商创建令牌(通过 Prisma 所有权验证)

#### Scenario: 使用 Prisma 类型

- **WHEN** 组件接收提供商和令牌数据
- **THEN** 数据类型从 `@prisma/client` 导入(`Provider`, `Token`, `User`)
- **AND** 所有类型安全检查使用 Prisma 生成的类型
- **AND** 关系数据(如 `provider.tokens`) 使用 Prisma 的 `include` 选项获取
