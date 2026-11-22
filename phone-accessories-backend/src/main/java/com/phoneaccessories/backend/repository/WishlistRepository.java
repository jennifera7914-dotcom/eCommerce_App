package com.phoneaccessories.backend.repository;

import com.phoneaccessories.backend.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUser_Id(Long userId);
    Optional<Wishlist> findByUser_IdAndProduct_Id(Long userId, Long productId);
    void deleteByUser_IdAndProduct_Id(Long userId, Long productId);
}