package com.phoneaccessories.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String phone;
    private String name;
    private String photoUrl;
    private Boolean isApproved;
}