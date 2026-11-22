package com.phoneaccessories.backend.repository;

import com.phoneaccessories.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByUser_IdOrderByCreatedAtAsc(Long userId);
    List<Message> findAllByOrderByCreatedAtAsc();
}